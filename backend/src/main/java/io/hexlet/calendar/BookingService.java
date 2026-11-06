package io.hexlet.calendar;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

  private final BookingRepository bookingRepository;
  private final MeetingTypeRepository meetingTypeRepository;
  private final Clock clock;
  private final ZoneId ownerZone;

  public BookingService(
      BookingRepository bookingRepository,
      MeetingTypeRepository meetingTypeRepository,
      Clock clock,
      @Value("${calendar.owner-timezone:Europe/Moscow}") String ownerTimezone) {
    this.bookingRepository = bookingRepository;
    this.meetingTypeRepository = meetingTypeRepository;
    this.clock = clock;
    this.ownerZone = ZoneId.of(ownerTimezone);
  }

  // synchronized: проверка пересечения и сохранение атомарны, гонку двух гостей решает сервер
  public synchronized Booking create(
      Long meetingTypeId, OffsetDateTime start, String guestName, String guestEmail, String note) {
    if (meetingTypeId == null || meetingTypeRepository.findById(meetingTypeId).isEmpty()) {
      throw new NotFoundException("Тип встречи не найден");
    }
    MeetingType type = meetingTypeRepository.findById(meetingTypeId).orElseThrow();
    validateStart(start, type);
    Instant bookingStart = start.toInstant();
    Instant bookingEnd = bookingStart.plusSeconds(type.durationMinutes() * 60L);
    boolean overlaps =
        bookingRepository.findAll().stream()
            .anyMatch(
                existing -> {
                  MeetingType existingType =
                      meetingTypeRepository.findById(existing.meetingTypeId()).orElseThrow();
                  Instant existingStart = existing.start().toInstant();
                  Instant existingEnd =
                      existingStart.plusSeconds(existingType.durationMinutes() * 60L);
                  return bookingStart.isBefore(existingEnd) && existingStart.isBefore(bookingEnd);
                });
    if (overlaps) {
      throw new ConflictException("Это время уже занято");
    }
    return bookingRepository.save(
        new Booking(null, meetingTypeId, start, guestName, guestEmail, note));
  }

  // Старт записи — старт слота: сетка 15 минут, слот целиком внутри 9:00–18:00,
  // дата в окне записи, время ещё не прошло (всё — в часовом поясе владельца)
  private void validateStart(OffsetDateTime start, MeetingType type) {
    ZonedDateTime localStart = start.atZoneSameInstant(ownerZone);
    LocalTime time = localStart.toLocalTime();
    if (time.getMinute() % CalendarRules.GRID_STEP_MINUTES != 0
        || time.getSecond() != 0
        || time.getNano() != 0) {
      throw new ValidationException(
          Map.of("start", "Время начала должно быть на сетке каждые 15 минут"));
    }
    if (time.isBefore(CalendarRules.DAY_START)
        || time.plusMinutes(type.durationMinutes()).isAfter(CalendarRules.DAY_END)) {
      throw new ValidationException(
          Map.of("start", "Слот должен целиком умещаться в границы 9:00–18:00"));
    }
    Instant now = clock.instant();
    LocalDate today = LocalDate.ofInstant(now, ownerZone);
    LocalDate date = localStart.toLocalDate();
    if (date.isBefore(today) || !date.isBefore(today.plusDays(CalendarRules.BOOKING_WINDOW_DAYS))) {
      throw new ValidationException(
          Map.of("start", "Дата должна быть в окне записи — 14 дней включая сегодня"));
    }
    if (!start.toInstant().isAfter(now)) {
      throw new ValidationException(Map.of("start", "Это время уже прошло"));
    }
  }

  // Предстоящие записи по возрастанию старта. «Прошедшая» — следствие текущего времени:
  // запись выпадает из списка, когда её интервал [start, start + длительность типа) прошёл
  public List<Booking> findUpcoming() {
    Instant now = clock.instant();
    return bookingRepository.findAll().stream()
        .filter(booking -> bookingEnd(booking).isAfter(now))
        .sorted(Comparator.comparing(booking -> booking.start().toInstant()))
        .toList();
  }

  private Instant bookingEnd(Booking booking) {
    MeetingType type = meetingTypeRepository.findById(booking.meetingTypeId()).orElseThrow();
    return booking.start().toInstant().plusSeconds(type.durationMinutes() * 60L);
  }
}

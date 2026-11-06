package io.hexlet.calendar;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

  private final BookingRepository bookingRepository;
  private final MeetingTypeRepository meetingTypeRepository;
  private final Clock clock;

  public BookingService(
      BookingRepository bookingRepository,
      MeetingTypeRepository meetingTypeRepository,
      Clock clock) {
    this.bookingRepository = bookingRepository;
    this.meetingTypeRepository = meetingTypeRepository;
    this.clock = clock;
  }

  public Booking create(
      Long meetingTypeId, OffsetDateTime start, String guestName, String guestEmail, String note) {
    if (meetingTypeId == null || meetingTypeRepository.findById(meetingTypeId).isEmpty()) {
      throw new NotFoundException("Тип встречи не найден");
    }
    MeetingType type = meetingTypeRepository.findById(meetingTypeId).orElseThrow();
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

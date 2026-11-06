package io.hexlet.calendar;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SlotService {

  private static final LocalTime DAY_START = LocalTime.of(9, 0);
  private static final LocalTime DAY_END = LocalTime.of(18, 0);
  private static final int GRID_STEP_MINUTES = 15;
  private static final int BOOKING_WINDOW_DAYS = 14;

  private final MeetingTypeRepository meetingTypeRepository;
  private final BookingRepository bookingRepository;
  private final Clock clock;
  private final ZoneId ownerZone;

  public SlotService(
      MeetingTypeRepository meetingTypeRepository,
      BookingRepository bookingRepository,
      Clock clock,
      @Value("${calendar.owner-timezone:Europe/Moscow}") String ownerTimezone) {
    this.meetingTypeRepository = meetingTypeRepository;
    this.bookingRepository = bookingRepository;
    this.clock = clock;
    this.ownerZone = ZoneId.of(ownerTimezone);
  }

  public List<Slot> slotsFor(long meetingTypeId, LocalDate date) {
    MeetingType type =
        meetingTypeRepository
            .findById(meetingTypeId)
            .orElseThrow(() -> new NotFoundException("Тип встречи не найден"));

    Instant now = clock.instant();
    LocalDate today = LocalDate.ofInstant(now, ownerZone);
    if (date.isBefore(today) || !date.isBefore(today.plusDays(BOOKING_WINDOW_DAYS))) {
      return List.of();
    }

    List<Slot> slots = new ArrayList<>();
    for (LocalTime start = DAY_START;
        !start.plusMinutes(type.durationMinutes()).isAfter(DAY_END);
        start = start.plusMinutes(GRID_STEP_MINUTES)) {
      ZonedDateTime slotStart = ZonedDateTime.of(date, start, ownerZone);
      if (!slotStart.toInstant().isAfter(now)) {
        continue;
      }
      Instant slotEnd = slotStart.toInstant().plusSeconds(type.durationMinutes() * 60L);
      String status = overlapsAnyBooking(slotStart.toInstant(), slotEnd) ? "busy" : "free";
      slots.add(new Slot(slotStart.toOffsetDateTime(), status));
    }
    return slots;
  }

  // Интервал записи — [start, start + длительность её типа); стык-в-стык не считается пересечением
  private boolean overlapsAnyBooking(Instant slotStart, Instant slotEnd) {
    return bookingRepository.findAll().stream()
        .anyMatch(
            booking -> {
              MeetingType bookingType =
                  meetingTypeRepository.findById(booking.meetingTypeId()).orElseThrow();
              Instant bookingStart = booking.start().toInstant();
              Instant bookingEnd = bookingStart.plusSeconds(bookingType.durationMinutes() * 60L);
              return slotStart.isBefore(bookingEnd) && bookingStart.isBefore(slotEnd);
            });
  }

  public record Slot(OffsetDateTime start, String status) {}
}

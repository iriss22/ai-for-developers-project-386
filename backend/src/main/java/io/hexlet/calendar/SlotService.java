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
    if (date.isBefore(today) || !date.isBefore(today.plusDays(CalendarRules.BOOKING_WINDOW_DAYS))) {
      return List.of();
    }

    List<Slot> slots = new ArrayList<>();
    for (LocalTime start = CalendarRules.DAY_START;
        !start.plusMinutes(type.durationMinutes()).isAfter(CalendarRules.DAY_END);
        start = start.plusMinutes(CalendarRules.GRID_STEP_MINUTES)) {
      ZonedDateTime slotStart = ZonedDateTime.of(date, start, ownerZone);
      if (!slotStart.toInstant().isAfter(now)) {
        continue;
      }
      BookingInterval slot = BookingInterval.of(slotStart.toInstant(), type.durationMinutes());
      SlotStatus status = overlapsAnyBooking(slot) ? SlotStatus.BUSY : SlotStatus.FREE;
      slots.add(new Slot(slotStart.toOffsetDateTime(), status));
    }
    return slots;
  }

  private boolean overlapsAnyBooking(BookingInterval slot) {
    return bookingRepository.findAll().stream()
        .map(
            booking ->
                BookingInterval.of(
                    booking, meetingTypeRepository.findById(booking.meetingTypeId()).orElseThrow()))
        .anyMatch(slot::overlaps);
  }

  public record Slot(OffsetDateTime start, SlotStatus status) {}
}

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
  private final Clock clock;
  private final ZoneId ownerZone;

  public SlotService(
      MeetingTypeRepository meetingTypeRepository,
      Clock clock,
      @Value("${calendar.owner-timezone:Europe/Moscow}") String ownerTimezone) {
    this.meetingTypeRepository = meetingTypeRepository;
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
      slots.add(new Slot(slotStart.toOffsetDateTime(), "free"));
    }
    return slots;
  }

  public record Slot(OffsetDateTime start, String status) {}
}

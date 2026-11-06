package io.hexlet.calendar;

import java.time.Instant;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

  private final BookingRepository bookingRepository;
  private final MeetingTypeRepository meetingTypeRepository;

  public BookingService(
      BookingRepository bookingRepository, MeetingTypeRepository meetingTypeRepository) {
    this.bookingRepository = bookingRepository;
    this.meetingTypeRepository = meetingTypeRepository;
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
}

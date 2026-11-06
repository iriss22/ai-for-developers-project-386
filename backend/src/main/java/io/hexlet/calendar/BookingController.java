package io.hexlet.calendar;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

  private final BookingService bookingService;
  private final MeetingTypeRepository meetingTypeRepository;

  public BookingController(
      BookingService bookingService, MeetingTypeRepository meetingTypeRepository) {
    this.bookingService = bookingService;
    this.meetingTypeRepository = meetingTypeRepository;
  }

  @GetMapping
  public List<BookingResponse> list() {
    return bookingService.findUpcoming().stream()
        .map(
            booking ->
                BookingResponse.of(
                    booking, meetingTypeRepository.findById(booking.meetingTypeId()).orElseThrow()))
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BookingResponse create(@Valid @RequestBody CreateBookingRequest request) {
    Booking booking =
        bookingService.create(
            request.meetingTypeId(),
            request.start(),
            request.guestName(),
            request.guestEmail(),
            request.note());
    MeetingType type = meetingTypeRepository.findById(booking.meetingTypeId()).orElseThrow();
    return BookingResponse.of(booking, type);
  }

  public record CreateBookingRequest(
      @NotNull(message = "Тип встречи обязателен") Long meetingTypeId,
      @NotNull(message = "Дата и время начала обязательны") OffsetDateTime start,
      @NotBlank(message = "Имя гостя обязательно")
          @Size(max = 100, message = "Имя гостя не длиннее 100 символов")
          String guestName,
      @NotBlank(message = "Email гостя обязателен") @Email(message = "Некорректный формат email")
          String guestEmail,
      @Size(max = 1000, message = "Заметка не длиннее 1000 символов") String note) {}

  public record BookingResponse(
      Long id,
      OffsetDateTime start,
      String guestName,
      String guestEmail,
      String note,
      BookingMeetingType meetingType) {

    static BookingResponse of(Booking booking, MeetingType type) {
      return new BookingResponse(
          booking.id(),
          booking.start(),
          booking.guestName(),
          booking.guestEmail(),
          booking.note(),
          new BookingMeetingType(type.id(), type.name(), type.durationMinutes()));
    }
  }

  public record BookingMeetingType(Long id, String name, int durationMinutes) {}
}

package io.hexlet.calendar;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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

  // То же правило, что EMAIL_PATTERN во фронтенде (GuestFormStep): local@domain.tld без пробелов
  private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @GetMapping
  public List<BookingResponse> list() {
    return bookingService.findUpcoming().stream().map(BookingResponse::of).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BookingResponse create(@Valid @RequestBody CreateBookingRequest request) {
    return BookingResponse.of(
        bookingService.create(
            new NewBooking(
                request.meetingTypeId(),
                request.start(),
                request.guestName(),
                request.guestEmail(),
                request.note())));
  }

  public record CreateBookingRequest(
      @NotNull(message = "Тип встречи обязателен") Long meetingTypeId,
      @NotNull(message = "Дата и время начала обязательны") OffsetDateTime start,
      @NotBlank(message = "Имя гостя обязательно")
          @Size(max = 100, message = "Имя гостя не длиннее 100 символов")
          String guestName,
      @NotBlank(message = "Email гостя обязателен")
          @Pattern(regexp = EMAIL_PATTERN, message = "Некорректный формат email")
          String guestEmail,
      @Size(max = 1000, message = "Заметка не длиннее 1000 символов") String note) {}

  public record BookingResponse(
      Long id,
      OffsetDateTime start,
      String guestName,
      String guestEmail,
      String note,
      BookingMeetingType meetingType) {

    static BookingResponse of(ScheduledBooking scheduled) {
      Booking booking = scheduled.booking();
      MeetingType type = scheduled.meetingType();
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

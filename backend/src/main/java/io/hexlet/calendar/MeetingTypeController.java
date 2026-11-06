package io.hexlet.calendar;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meeting-types")
public class MeetingTypeController {

  private final MeetingTypeService service;

  public MeetingTypeController(MeetingTypeService service) {
    this.service = service;
  }

  @GetMapping
  public List<MeetingType> list() {
    return service.findAll();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public MeetingType create(@Valid @RequestBody CreateMeetingTypeRequest request) {
    return service.create(request.name(), request.description(), request.durationMinutes());
  }

  public record CreateMeetingTypeRequest(
      @NotBlank(message = "Название обязательно")
          @Size(max = 100, message = "Название не длиннее 100 символов")
          String name,
      @Size(max = 1000, message = "Описание не длиннее 1000 символов") String description,
      @NotNull(message = "Длительность должна быть 15, 30 или 60 минут") Integer durationMinutes) {}
}

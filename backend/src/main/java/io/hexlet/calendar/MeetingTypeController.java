package io.hexlet.calendar;

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
  public MeetingType create(@RequestBody CreateMeetingTypeRequest request) {
    return service.create(request.name(), request.description(), request.durationMinutes());
  }

  public record CreateMeetingTypeRequest(String name, String description, int durationMinutes) {}
}

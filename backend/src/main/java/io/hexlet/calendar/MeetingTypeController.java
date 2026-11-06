package io.hexlet.calendar;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/meeting-types")
public class MeetingTypeController {

  private final MeetingTypeRepository repository;

  public MeetingTypeController(MeetingTypeRepository repository) {
    this.repository = repository;
  }

  @GetMapping
  public List<MeetingType> list() {
    return repository.findAll();
  }
}

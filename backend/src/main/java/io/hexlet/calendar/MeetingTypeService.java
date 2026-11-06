package io.hexlet.calendar;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MeetingTypeService {

  private final MeetingTypeRepository repository;

  public MeetingTypeService(MeetingTypeRepository repository) {
    this.repository = repository;
  }

  public List<MeetingType> findAll() {
    return repository.findAll();
  }

  public MeetingType create(String name, String description, int durationMinutes) {
    return repository.save(new MeetingType(null, name.strip(), description, durationMinutes));
  }
}

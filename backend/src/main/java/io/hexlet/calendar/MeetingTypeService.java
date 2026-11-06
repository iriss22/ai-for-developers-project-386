package io.hexlet.calendar;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

  public MeetingType getById(long id) {
    return repository
        .findById(id)
        .orElseThrow(() -> new NotFoundException("Тип встречи не найден"));
  }

  private static final List<Integer> ALLOWED_DURATIONS = List.of(15, 30, 60);

  public MeetingType create(String name, String description, Integer durationMinutes) {
    Map<String, String> errors = new LinkedHashMap<>();
    // Уникальность — по обрезанному названию без учёта регистра; храним название как введено
    boolean nameTaken =
        repository.findAll().stream()
            .anyMatch(existing -> existing.name().strip().equalsIgnoreCase(name.strip()));
    if (nameTaken) {
      errors.put("name", "Тип встречи с таким названием уже существует");
    }
    if (durationMinutes == null || !ALLOWED_DURATIONS.contains(durationMinutes)) {
      errors.put("durationMinutes", "Длительность должна быть 15, 30 или 60 минут");
    }
    if (!errors.isEmpty()) {
      throw new ValidationException(errors);
    }
    return repository.save(new MeetingType(null, name, description, durationMinutes));
  }
}

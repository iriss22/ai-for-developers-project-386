package io.hexlet.calendar;

import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

  private final SlotService service;

  public SlotController(SlotService service) {
    this.service = service;
  }

  @GetMapping
  public List<SlotService.Slot> list(
      @RequestParam long meetingTypeId,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return service.slotsFor(meetingTypeId, date);
  }
}

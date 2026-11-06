package io.hexlet.calendar;

import java.util.List;

public interface MeetingTypeRepository {

  List<MeetingType> findAll();

  MeetingType save(MeetingType meetingType);
}

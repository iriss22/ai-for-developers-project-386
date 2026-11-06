package io.hexlet.calendar;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import tools.jackson.core.JacksonException;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleValidation(ValidationException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("errors", ex.getErrors()));
  }

  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<Map<String, String>> handleNotFound(NotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<Map<String, String>> handleConflict(ConflictException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ex.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleBeanValidation(
      MethodArgumentNotValidException ex) {
    Map<String, String> errors = new LinkedHashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("errors", errors));
  }

  // Битый JSON или неверный тип поля в теле: ответ приводим к форме {"errors": {"<поле>": "…"}}
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleNotReadable(
      HttpMessageNotReadableException ex) {
    String field = "request";
    if (ex.getCause() instanceof JacksonException jacksonException) {
      field =
          jacksonException.getPath().stream()
              .map(JacksonException.Reference::getPropertyName)
              .filter(Objects::nonNull)
              .findFirst()
              .orElse(field);
    }
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("errors", Map.of(field, "Некорректное значение")));
  }

  // Неверный тип параметра запроса (например, meetingTypeId=abc)
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleTypeMismatch(
      MethodArgumentTypeMismatchException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("errors", Map.of(ex.getName(), "Некорректное значение параметра")));
  }

  // Обязательный параметр запроса не передан (например, GET /api/slots без date)
  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<Map<String, Map<String, String>>> handleMissingParameter(
      MissingServletRequestParameterException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(Map.of("errors", Map.of(ex.getParameterName(), "Обязательный параметр")));
  }
}

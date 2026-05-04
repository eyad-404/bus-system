package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.StudentResponseDTO;
import org.smartclinic.bus_system.Entity.Student;
import org.smartclinic.bus_system.Repository.StudentRepository;
import org.smartclinic.bus_system.Service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final StudentRepository studentRepository;

    public StudentController(StudentService studentService, StudentRepository studentRepository) {
        this.studentService = studentService;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getStudentMe(@RequestParam Long userId) {
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("studentId", student.getId());
        m.put("userId", userId);
        m.put("name", student.getUser() != null ? student.getUser().getName() : "");
        m.put("email", student.getUser() != null ? student.getUser().getEmail() : "");
        m.put("boardingStationId", student.getBoardingStation() != null ? student.getBoardingStation().getId() : null);
        m.put("boardingStationName", student.getBoardingStation() != null ? student.getBoardingStation().getName() : null);
        if (student.getUser() != null && student.getUser().getRole() != null) {
            m.put("routeId", null); // will be null unless assigned
        }
        return ResponseEntity.ok(m);
    }

    @PutMapping("/{studentId}/boarding-station/{stationId}")
    public ResponseEntity<StudentResponseDTO> updateBoardingStation(
            @PathVariable Long studentId,
            @PathVariable Long stationId) {
        StudentResponseDTO response = studentService.updateBoardingStation(studentId, stationId);
        return ResponseEntity.ok(response);
    }
}

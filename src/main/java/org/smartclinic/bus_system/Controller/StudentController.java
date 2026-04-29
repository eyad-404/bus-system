package org.smartclinic.bus_system.Controller;

import org.smartclinic.bus_system.DTOs.StudentResponseDTO;
import org.smartclinic.bus_system.Service.StudentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PutMapping("/{studentId}/boarding-station/{stationId}")
    public ResponseEntity<StudentResponseDTO> updateBoardingStation(
            @PathVariable Long studentId,
            @PathVariable Long stationId) {
        StudentResponseDTO response = studentService.updateBoardingStation(studentId, stationId);
        return ResponseEntity.ok(response);
    }
}

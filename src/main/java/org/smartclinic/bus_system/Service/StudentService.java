package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.DTOs.StudentResponseDTO;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Entity.Student;
import org.smartclinic.bus_system.Exception.ResourceNotFoundException;
import org.smartclinic.bus_system.MAPPER.StudentMapper;
import org.smartclinic.bus_system.Repository.StationRepository;
import org.smartclinic.bus_system.Repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final StationRepository stationRepository;

    public StudentService(StudentRepository studentRepository, StationRepository stationRepository) {
        this.studentRepository = studentRepository;
        this.stationRepository = stationRepository;
    }

    @Transactional
    public StudentResponseDTO updateBoardingStation(Long studentId, Long stationId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));

        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new ResourceNotFoundException("Station not found with ID: " + stationId));

        student.setBoardingStation(station);
        Student savedStudent = studentRepository.save(student);

        return StudentMapper.toDTO(savedStudent);
    }
}

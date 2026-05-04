package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.StudentResponseDTO;
import org.smartclinic.bus_system.Entity.Student;

public class StudentMapper {

    public static StudentResponseDTO toDTO(Student s){
        StudentResponseDTO dto = new StudentResponseDTO();
        dto.setId(s.getId());

        if (s.getUser() != null) {
            dto.setUserId(s.getUser().getId());
            dto.setStudentName(s.getUser().getName()); // Assuming User has name, will check
        }

        if (s.getBoardingStation() != null) {
            dto.setBoardingStationId(s.getBoardingStation().getId());
            dto.setBoardingStationName(s.getBoardingStation().getName());
        }
        return dto;
    }
}
package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.StudentsResponseDTO;
import org.smartclinic.bus_system.Entity.Student;

public class StudentMapper {

    public static StudentsResponseDTO toDTO(Student s){
        StudentsResponseDTO dto = new StudentsResponseDTO();
        dto.setId(s.getId());
        dto.setUserId(s.getUser().getId());
        dto.setBoardingStationId(
                s.getBoardingStation() != null ? s.getBoardingStation().getId() : null
        );
        return dto;
    }
}
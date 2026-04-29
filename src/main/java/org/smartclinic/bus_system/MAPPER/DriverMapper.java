package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.DriverResponseDTO;
import org.smartclinic.bus_system.Entity.Driver;

public class DriverMapper {

    public static DriverResponseDTO toDTO(Driver d){
        DriverResponseDTO dto = new DriverResponseDTO();
        dto.setId(d.getId());
        dto.setUserId(d.getUser().getId());
        return dto;
    }
}
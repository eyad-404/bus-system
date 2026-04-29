package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.StationResponseDTO;
import org.smartclinic.bus_system.Entity.Station;

public class StationMapper {
    public static StationResponseDTO toDTO(Station s){
        StationResponseDTO dto = new StationResponseDTO();
        dto.setId(s.getId());
        dto.setName(s.getName());
        return dto;
    }
}

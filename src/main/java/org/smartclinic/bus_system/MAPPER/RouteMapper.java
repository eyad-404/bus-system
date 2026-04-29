package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.RouteResponseDTO;
import org.smartclinic.bus_system.Entity.Route;

public class RouteMapper {
    public static RouteResponseDTO toDTO(Route r){
        RouteResponseDTO dto = new RouteResponseDTO();
        dto.setId(r.getId());
        dto.setName(r.getName());
        dto.setCode(r.getCode());
        return dto;
    }
}

package org.smartclinic.bus_system.MAPPER;

import org.smartclinic.bus_system.DTOs.TripProgressResponseDTO;
import org.smartclinic.bus_system.Entity.TripProgress;

public class TripProgressMapper {
    public static TripProgressResponseDTO toDTO(TripProgress tp){
        TripProgressResponseDTO dto = new TripProgressResponseDTO();
        dto.setTripId(tp.getTrip().getId());
        dto.setStationId(tp.getStation().getId());
        dto.setStatus(tp.getStatus().name());
        return dto;
    }
}

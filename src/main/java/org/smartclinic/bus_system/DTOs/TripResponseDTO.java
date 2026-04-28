package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TripResponseDTO {
    private Long id;
    private Long routeId;
    private Long driverId;
    private String status;
    private Integer currentStationIndex;
    private List<StationProgressDTO> stationProgress;
}
package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class TripResponseDTO {
    private Long id;
    private Long routeId;
    private String routeName;
    private String routeCode;
    private Long driverId;
    private Long driverUserId;
    private String driverName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Integer currentStationIndex;
    private String currentStationName;
    private List<StationProgressDTO> stationProgress;
}
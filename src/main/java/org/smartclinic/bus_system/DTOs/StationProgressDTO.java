package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class StationProgressDTO {
    private Long stationId;
    private String stationName;
    private String status;
    private LocalDateTime arrivalTime;
    private Boolean hasArrived;
}

package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TripRequestDTO {
    private Long routeId;
    private Long driverId;
}
package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StudentRequestDTO {
    private Long userId;
    private Long boardingStationId;
}
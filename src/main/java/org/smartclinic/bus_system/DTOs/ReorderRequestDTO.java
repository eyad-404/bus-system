package org.smartclinic.bus_system.DTOs;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ReorderRequestDTO {
    private List<Long> routeStationIds;
}

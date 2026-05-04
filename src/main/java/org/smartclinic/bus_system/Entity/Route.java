package org.smartclinic.bus_system.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @NotBlank
    private String name;

    @NotBlank
    @Column(unique = true)
    private String code;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RouteStation> routeStations;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private Driver driver;
}

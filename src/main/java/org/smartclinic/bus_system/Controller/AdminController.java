package org.smartclinic.bus_system.Controller;

import lombok.RequiredArgsConstructor;
import org.smartclinic.bus_system.DTOs.CreateUserDTO;
import org.smartclinic.bus_system.DTOs.RouteResponseDTO;
import org.smartclinic.bus_system.DTOs.UserResponseDTO;
import org.smartclinic.bus_system.Entity.Driver;
import org.smartclinic.bus_system.Entity.Route;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Entity.Student;
import org.smartclinic.bus_system.Entity.User;
import org.smartclinic.bus_system.MAPPER.RouteMapper;
import org.smartclinic.bus_system.Repository.DriverRepository;
import org.smartclinic.bus_system.Repository.RouteRepository;
import org.smartclinic.bus_system.Repository.StationRepository;
import org.smartclinic.bus_system.Repository.StudentRepository;
import org.smartclinic.bus_system.Repository.UserRepository;
import org.smartclinic.bus_system.enums.Role;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final DriverRepository driverRepository;
    private final StationRepository stationRepository;
    private final RouteRepository routeRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/routes")
    public ResponseEntity<List<RouteResponseDTO>> getRoutes() {
        return ResponseEntity.ok(routeRepository.findAll().stream()
                .map(RouteMapper::toDTO).collect(Collectors.toList()));
    }

    @PutMapping("/routes/{routeId}/assign-driver")
    public ResponseEntity<RouteResponseDTO> assignDriverToRoute(
            @PathVariable Long routeId,
            @RequestParam Long driverId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
        Driver driver = driverRepository.findByUserId(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
        route.setDriver(driver);
        return ResponseEntity.ok(RouteMapper.toDTO(routeRepository.save(route)));
    }

    @DeleteMapping("/routes/{routeId}/driver")
    public ResponseEntity<RouteResponseDTO> removeDriverFromRoute(@PathVariable Long routeId) {
        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found"));
        route.setDriver(null);
        return ResponseEntity.ok(RouteMapper.toDTO(routeRepository.save(route)));
    }

    @GetMapping("/students")
    public ResponseEntity<List<UserResponseDTO>> getStudents() {
        return ResponseEntity.ok(userRepository.findAllByRole(Role.STUDENT).stream()
                .map(this::mapToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<UserResponseDTO>> getDrivers() {
        return ResponseEntity.ok(userRepository.findAllByRole(Role.DRIVER).stream()
                .map(this::mapToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/students/search")
    public ResponseEntity<List<UserResponseDTO>> searchStudents(@RequestParam String query) {
        return ResponseEntity
                .ok(userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query).stream()
                        .filter(u -> u.getRole() == Role.STUDENT)
                        .map(this::mapToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/drivers/search")
    public ResponseEntity<List<UserResponseDTO>> searchDrivers(@RequestParam String query) {
        return ResponseEntity
                .ok(userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query).stream()
                        .filter(u -> u.getRole() == Role.DRIVER)
                        .map(this::mapToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/students/with-station")
    public ResponseEntity<List<Map<String, Object>>> getStudentsWithStation() {
        List<Map<String, Object>> result = studentRepository.findAll().stream().map(student -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("studentId", student.getId());
            m.put("userId", student.getUser() != null ? student.getUser().getId() : null);
            m.put("name", student.getUser() != null ? student.getUser().getName() : "");
            m.put("email", student.getUser() != null ? student.getUser().getEmail() : "");
            m.put("boardingStationId",
                    student.getBoardingStation() != null ? student.getBoardingStation().getId() : null);
            m.put("boardingStationName",
                    student.getBoardingStation() != null ? student.getBoardingStation().getName() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/students/{studentId}/assign-station")
    public ResponseEntity<Void> assignStation(
            @PathVariable Long studentId,
            @RequestParam Long stationId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Station not found"));
        student.setBoardingStation(station);
        studentRepository.save(student);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/students/{studentId}/assign-station")
    public ResponseEntity<Void> clearStation(@PathVariable Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));
        student.setBoardingStation(null);
        studentRepository.save(student);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/create-user")
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody CreateUserDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setEncodedPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(Role.valueOf(dto.getRole().toUpperCase()));
        user.setFirstLogin(true);

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.STUDENT) {
            Student student = new Student();
            student.setUser(savedUser);
            studentRepository.save(student);
        } else if (savedUser.getRole() == Role.DRIVER) {
            Driver driver = new Driver();
            driver.setUser(savedUser);
            driverRepository.save(driver);
        }

        return ResponseEntity.ok(mapToDTO(savedUser));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<UserResponseDTO> updateStudent(@PathVariable Long id, @RequestBody CreateUserDTO dto) {
        return updateUser(id, dto);
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<UserResponseDTO> updateDriver(@PathVariable Long id, @RequestBody CreateUserDTO dto) {
        return updateUser(id, dto);
    }

    private ResponseEntity<UserResponseDTO> updateUser(Long id, CreateUserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setEncodedPassword(passwordEncoder.encode(dto.getPassword()));
        }
        return ResponseEntity.ok(mapToDTO(userRepository.save(user)));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        return deleteUser(id, Role.STUDENT);
    }

    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        return deleteUser(id, Role.DRIVER);
    }

    private ResponseEntity<Void> deleteUser(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (role == Role.STUDENT) {
            studentRepository.findByUserId(id).ifPresent(studentRepository::delete);
        } else if (role == Role.DRIVER) {
            driverRepository.findByUserId(id).ifPresent(driverRepository::delete);
        }
        userRepository.delete(user);
        return ResponseEntity.ok().build();
    }

    private UserResponseDTO mapToDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        return dto;
    }
}

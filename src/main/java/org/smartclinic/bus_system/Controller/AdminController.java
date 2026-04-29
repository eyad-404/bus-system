package org.smartclinic.bus_system.Controller;

import lombok.RequiredArgsConstructor;
import org.smartclinic.bus_system.DTOs.CreateUserDTO;
import org.smartclinic.bus_system.DTOs.UserResponseDTO;
import org.smartclinic.bus_system.Entity.Driver;
import org.smartclinic.bus_system.Entity.Student;
import org.smartclinic.bus_system.Entity.User;
import org.smartclinic.bus_system.Repository.DriverRepository;
import org.smartclinic.bus_system.Repository.StudentRepository;
import org.smartclinic.bus_system.Repository.UserRepository;
import org.smartclinic.bus_system.enums.Role;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;

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
        return ResponseEntity.ok(userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query).stream()
                .filter(u -> u.getRole() == Role.STUDENT)
                .map(this::mapToDTO).collect(Collectors.toList()));
    }

    @GetMapping("/drivers/search")
    public ResponseEntity<List<UserResponseDTO>> searchDrivers(@RequestParam String query) {
        return ResponseEntity.ok(userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query).stream()
                .filter(u -> u.getRole() == Role.DRIVER)
                .map(this::mapToDTO).collect(Collectors.toList()));
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
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setEncodedPassword(passwordEncoder.encode(dto.getPassword()));
        }
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(mapToDTO(savedUser));
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
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (role == Role.STUDENT && user.getStudent() != null) {
            studentRepository.delete(user.getStudent());
        } else if (role == Role.DRIVER && user.getDriver() != null) {
            driverRepository.delete(user.getDriver());
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

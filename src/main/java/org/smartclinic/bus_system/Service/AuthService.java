package org.smartclinic.bus_system.Service;

import lombok.RequiredArgsConstructor;
import org.smartclinic.bus_system.DTOs.AuthResponseDTO;
import org.smartclinic.bus_system.DTOs.CreateUserDTO;
import org.smartclinic.bus_system.DTOs.LoginRequestDTO;
import org.smartclinic.bus_system.Entity.User;
import org.smartclinic.bus_system.Repository.UserRepository;
import org.smartclinic.bus_system.enums.Role;
import org.smartclinic.bus_system.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponseDTO login(LoginRequestDTO request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return new AuthResponseDTO(
                token,
                user.getRole().name(),
                user.isFirstLogin()
        );
    }

    public void registerAdmin(CreateUserDTO dto) {

        if (userRepository.existsByRole(Role.ADMIN)) {
            throw new RuntimeException("Admin already exists");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setRole(Role.ADMIN);
        user.setFirstLogin(true);
        user.setEncodedPassword(passwordEncoder.encode(dto.getPassword()));

        userRepository.save(user);
    }

    public void changePassword(String email, String newPassword) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEncodedPassword(passwordEncoder.encode(newPassword));
        user.setFirstLogin(false);

        userRepository.save(user);
    }
}
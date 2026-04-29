package org.smartclinic.bus_system.Entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.smartclinic.bus_system.enums.Role;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 50)
    private String name;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Setter(AccessLevel.NONE)
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    public void setEncodedPassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Role is required")
    private Role role;

    @Column(name = "first_login")
    private boolean firstLogin = true;

    @OneToOne(mappedBy = "user")
    private Driver driver;

    @OneToOne(mappedBy = "user")
    private Student student;
}

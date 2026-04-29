package org.smartclinic.bus_system.Service;

import org.smartclinic.bus_system.Entity.Notification;
import org.smartclinic.bus_system.Entity.Station;
import org.smartclinic.bus_system.Entity.Student;
import org.smartclinic.bus_system.MAPPER.NotificationMapper;
import org.smartclinic.bus_system.Repository.NotificationRepository;
import org.smartclinic.bus_system.Repository.StudentRepository;
import org.smartclinic.bus_system.enums.NotificationType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import org.smartclinic.bus_system.DTOs.NotificationResponseDTO;

@Service
public class NotificationService {

    private final StudentRepository studentRepository;
    private final NotificationRepository notificationRepository;

    public NotificationService(StudentRepository studentRepository,
                               NotificationRepository notificationRepository) {
        this.studentRepository = studentRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void notifyStudentsForStation(Station station) {
        if (station == null || station.getId() == null) {
            return;
        }

        List<Student> students = studentRepository.findAllByBoardingStationId(station.getId());
        LocalDateTime now = LocalDateTime.now();

        for (Student student : students) {
            if (student.getUser() == null) {
                continue;
            }

            Notification notification = new Notification();
            notification.setUser(student.getUser());
            notification.setStation(station);
            notification.setType(NotificationType.ARRIVAL);
            notification.setMessage("Bus arrived at " + station.getName());
            notification.setRead(false);
            notification.setCreatedAt(now);
            notificationRepository.save(notification);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotificationsByUserId(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationMapper::toDTO)
                .toList();
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}

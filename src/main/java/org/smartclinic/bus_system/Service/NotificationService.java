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
    public void notifyStudentsForStation(Station station, org.smartclinic.bus_system.Entity.Trip trip, boolean isApproaching) {
        if (station == null || station.getId() == null) {
            return;
        }

        List<Student> students = studentRepository.findAllByBoardingStationId(station.getId());
        LocalDateTime now = LocalDateTime.now();

        for (Student student : students) {
            if (student.getUser() == null) {
                continue;
            }

            // Prevent duplicate notification logic - simplistic check (can be improved based on exact requirements)
            // Just creating the notification for now as required.
            createNotification(
                    student.getUser(),
                    trip,
                    station,
                    isApproaching ? NotificationType.ALERT : NotificationType.INFO,
                    isApproaching ? "Bus Alert" : "Bus Arrival",
                    isApproaching ? "Bus is near your station." : "Bus arrived at " + station.getName()
            );
        }
    }

    @Transactional
    public NotificationResponseDTO createNotification(org.smartclinic.bus_system.Entity.User user, org.smartclinic.bus_system.Entity.Trip trip, Station station, NotificationType type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTrip(trip);
        notification.setStation(station);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        
        Notification saved = notificationRepository.save(notification);
        return NotificationMapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotificationsByUserId(Long userId) {
        return getUserNotifications(userId);
    }

    @Transactional
    public NotificationResponseDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new org.smartclinic.bus_system.Exception.ResourceNotFoundException("Notification not found"));
        notification.setRead(true);
        notificationRepository.save(notification);
        return NotificationMapper.toDTO(notification);
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

package com.parallax.backend.parallax.repository.chat;

import com.parallax.backend.parallax.entity.chat.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {
    
    @Query("SELECT m FROM DirectMessage m WHERE (m.senderId = :user1Id AND m.receiverId = :user2Id) OR (m.senderId = :user2Id AND m.receiverId = :user1Id) ORDER BY m.createdAt ASC")
    List<DirectMessage> findChatHistory(@Param("user1Id") UUID user1Id, @Param("user2Id") UUID user2Id);
    
}

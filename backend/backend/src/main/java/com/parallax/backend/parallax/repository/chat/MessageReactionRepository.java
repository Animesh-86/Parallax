package com.parallax.backend.parallax.repository.chat;

import com.parallax.backend.parallax.entity.chat.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, UUID> {
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmojiCode(UUID messageId, UUID userId, String emojiCode);
}

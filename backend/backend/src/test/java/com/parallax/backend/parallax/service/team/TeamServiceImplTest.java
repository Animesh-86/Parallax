package com.parallax.backend.parallax.service.team;

import com.parallax.backend.parallax.dto.team.CreateTeamRequest;
import com.parallax.backend.parallax.dto.team.TeamResponse;
import com.parallax.backend.parallax.entity.auth.User;
import com.parallax.backend.parallax.entity.team.Team;
import com.parallax.backend.parallax.entity.team.TeamMember;
import com.parallax.backend.parallax.entity.team.TeamMemberRole;
import com.parallax.backend.parallax.entity.team.TeamMemberStatus;
import com.parallax.backend.parallax.exception.ResourceNotFoundException;
import com.parallax.backend.parallax.repository.UserRepository;
import com.parallax.backend.parallax.repository.collaborator.ProjectCollaboratorRepository;
import com.parallax.backend.parallax.repository.project.ProjectRepository;
import com.parallax.backend.parallax.repository.team.TeamMemberRepository;
import com.parallax.backend.parallax.repository.team.TeamRepository;
import com.parallax.backend.parallax.store.SessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceImplTest {

    @Mock
    private TeamRepository teamRepository;
    @Mock
    private TeamMemberRepository teamMemberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SessionRegistry sessionRegistry;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectCollaboratorRepository collaboratorRepository;

    @InjectMocks
    private TeamServiceImpl teamService;

    private User owner;
    private Team team;

    @BeforeEach
    void setUp() {
        owner = new User("Test", "test", "t@t.com", "hash", "LOCAL");
        org.springframework.test.util.ReflectionTestUtils.setField(owner, "id", UUID.randomUUID());

        team = new Team();
        team.setId(UUID.randomUUID());
        team.setName("Test Team");
        team.setOwner(owner);
    }

    @Test
    void createTeam_Success() {
        CreateTeamRequest req = new CreateTeamRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(req, "name", "Test Team");
        org.springframework.test.util.ReflectionTestUtils.setField(req, "description", "Description");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(teamRepository.save(any(Team.class))).thenReturn(team);
        when(teamMemberRepository.countByTeam_IdAndStatus(any(), any())).thenReturn(1L);

        TeamResponse res = teamService.createTeam(req, owner.getId());

        assertNotNull(res);
        assertEquals("Test Team", res.name());
        verify(teamRepository).save(any(Team.class));
        verify(teamMemberRepository).save(any(TeamMember.class));
    }

    @Test
    void createTeam_NameTooShort_ThrowsException() {
        CreateTeamRequest req = new CreateTeamRequest();
        org.springframework.test.util.ReflectionTestUtils.setField(req, "name", "T");

        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        assertThrows(IllegalArgumentException.class, () -> teamService.createTeam(req, owner.getId()));
        verify(teamRepository, never()).save(any(Team.class));
    }

    @Test
    void getTeam_Success() {
        TeamMember membership = new TeamMember();
        membership.setRole(TeamMemberRole.OWNER);
        membership.setStatus(TeamMemberStatus.ACTIVE);

        when(teamRepository.findById(team.getId())).thenReturn(Optional.of(team));
        when(teamMemberRepository.findByTeam_IdAndUser_Id(team.getId(), owner.getId())).thenReturn(Optional.of(membership));
        when(teamMemberRepository.countByTeam_IdAndStatus(team.getId(), TeamMemberStatus.ACTIVE)).thenReturn(1L);
        when(teamMemberRepository.countByTeam_IdAndStatus(team.getId(), TeamMemberStatus.INVITED)).thenReturn(0L);

        TeamResponse res = teamService.getTeam(team.getId(), owner.getId());

        assertNotNull(res);
        assertEquals(team.getId(), res.id());
    }

    @Test
    void getTeam_NotFound_ThrowsException() {
        when(teamRepository.findById(team.getId())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> teamService.getTeam(team.getId(), owner.getId()));
    }
}

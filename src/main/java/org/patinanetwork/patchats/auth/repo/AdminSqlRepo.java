package org.patinanetwork.patchats.auth.repo;

import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.patinanetwork.patchats.auth.dto.AdminDto;
import org.patinanetwork.patchats.common.web.exception.AdminDuplicateException;
import org.patinanetwork.patchats.common.web.exception.AdminNotFoundException;
import org.patinanetwork.patchats.common.web.exception.ValidationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Plain-SQL implementation of {@link AdminRepo}. */
@Repository
@RequiredArgsConstructor
public class AdminSqlRepo implements AdminRepo {

    private static final String COL_EMAIL = "email";

    private final RowMapper<AdminDto> adminRowMapper = (rs, rowNum) -> new AdminDto(
            rs.getString(COL_EMAIL), rs.getString("note"), rs.getObject("created_at", OffsetDateTime.class));

    private final JdbcClient jdbc;

    /**
     * Normalisation is deliberately left to the database's {@code normalize_email}, the same function the table's write
     * trigger applies. Wrapping the parameter rather than the column also keeps the primary-key index usable.
     */
    @Override
    public boolean isAdmin(final String email) {
        return Boolean.TRUE.equals(jdbc.sql("SELECT EXISTS(SELECT 1 FROM admins WHERE email = normalize_email(:email))")
                .param("email", email)
                .query(Boolean.class)
                .single());
    }

    @Override
    public List<AdminDto> listAdmins() {
        return jdbc.sql("SELECT email, note, created_at FROM admins ORDER BY created_at ASC")
                .query(adminRowMapper)
                .list();
    }

    @Override
    public AdminDto addAdmin(final String email, final String note) {
        try {
            return jdbc.sql("INSERT INTO admins (email, note) VALUES (:email, :note) RETURNING email, note, created_at")
                    .param(COL_EMAIL, email)
                    .param("note", note)
                    .query(adminRowMapper)
                    .single();
        } catch (DataIntegrityViolationException _e) {
            throw new AdminDuplicateException(email);
        }
    }

    @Override
    public void removeAdmin(final String email) {
        final int count =
                jdbc.sql("SELECT COUNT(*) FROM admins").query(Integer.class).single();
        if (count <= 1) {
            throw new ValidationException("Cannot remove the last admin");
        }
        final int deleted = jdbc.sql("DELETE FROM admins WHERE email = normalize_email(:email)")
                .param(COL_EMAIL, email)
                .update();
        if (deleted == 0) {
            throw new AdminNotFoundException(email);
        }
    }
}

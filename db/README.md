# `db/`

```mermaid
erDiagram
    flyway_schema_history {
        integer installed_rank PK "{NOT_NULL}"
        character_varying version
        character_varying description "{NOT_NULL}"
        character_varying type "{NOT_NULL}"
        character_varying script "{NOT_NULL}"
        integer checksum
        character_varying installed_by "{NOT_NULL}"
        timestamp installed_on "{NOT_NULL}"
        integer execution_time "{NOT_NULL}"
        boolean success "{NOT_NULL}"
    }

    match_cycles {
        integer id PK "{NOT_NULL}"
        text period
        timestamptz run_at "{NOT_NULL}"
        integer total_members
        integer total_matched
    }

    matches {
        uuid id PK "{NOT_NULL}"
        uuid member_a_id FK "{NOT_NULL}"
        uuid member_b_id FK "{NOT_NULL}"
        integer cycle_id FK "{NOT_NULL}"
        real match_score
        text status
        text feedback_a
        text feedback_b
        timestamptz created_at "{NOT_NULL}"
    }

    members {
        uuid id PK "{NOT_NULL}"
        text first_name "{NOT_NULL}"
        text last_name "{NOT_NULL}"
        text email UK "{NOT_NULL}"
        text linked_in_url
        text introduction
        text referral_source
        boolean active
        text match_pref
        text industry_pref
        text role_pref
        text topics
        text extra_notes
        timestamptz created_at "{NOT_NULL}"
        timestamptz updated_at "{NOT_NULL}"
    }

    matches }o--|| match_cycles : "cycle_id"
    matches }o--|| members : "member_a_id"
    matches }o--|| members : "member_b_id"
```

<p align="center">
    <i>
        Generated with
        <code>
        set -a && . ./.env && set +a && mermerd   --debug   -c="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}"   -s=public   --outputMode=stdout   --useAllTables   --showDescriptions   enumValues,columnComments,notNull
        </code>
    </i>
</p>
<p align="center">
    <i>
        Last updated: 07/06/26
    </i>
</p>

This directory contains the migrations that are applied to our [PostgreSQL](https://www.postgresql.org/) databases.

## Commands

To migrate your local database using your root `.env`, you can simply run:

```bash
just migrate
```

If you need to drop it quickly, you can simply run:

```bash
just drop
```

## Versioned Migrations

Versioned migrations are under `db/migration/`

> [!NOTE]
> Versioned migrations are applied to all databases

### Explanation

- Versioned migrations will only run once.
- You can use these migrations to define tables, schemas, columns (otherwise known as DDL) OR define insertions/updates/deletes of certain columns (otherwise known as DML).
> If you need mock data **only for local development**, see [local repeatable migrations](#local-repeatable-migrations).

### Naming Scheme

#### Requirements

`V00{number}__{description}.SQL`

1. Name must be prefixed with a `V`.
1. Version numbers must be sequential and unique.
    - Version numbers must be 4 digits wide. You may pad the left-side with 0s until you reach that goal.
1. Double underscores (\_\_) separate the version from the description
1. Use underscores (\_) instead of spaces in descriptions
1. Files must have `.sql` (or `.SQL`) extension

#### Examples

```txt
V0005__Add_user_table.SQL
V0642__Insert_new_tag_enums.SQL
V9999__Delete_user_table.SQL
```

## Local Repeatable Migrations

Local repeatable migrations are under `db/repeated/`.

> [!NOTE]
> `just migrate` explicitly includes this directory. Production and staging migrations only scan `db/migration`, so local seed data is never applied to remote databases.

### Explanation

1. Instead of being run just once, repeatable migrations are (re-)applied to a database on [migrate](https://documentation.red-gate.com/fd/migrate-277578887.html) every time their checksum changes.
1. These migrations generate mock data for local development and are excluded from production and staging migrations.

#### Requirements

1. Name must be prefixed with an `R__Mock`
1. Version numbers must be sequential and unique
1. Use underscores (\_) instead of spaces in descriptions
1. Files must have `.sql` (or `.SQL`) extension

#### Examples

```txt
R__Mock_V0005_Insert_mock_users.SQL
R__Mock_V0011_Add_old_leaderboards.SQL
R__Mock_V9999_Delete_old_mock_users_and_insert_new_users.SQL
```

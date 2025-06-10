import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1749569793143 implements MigrationInterface {
    name = 'InitialMigration1749569793143'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "title" character varying(20) NOT NULL, "description" text, "status" character varying(20) NOT NULL DEFAULT 'todo', "priority" character varying(10) NOT NULL DEFAULT 'medium', "dueDate" TIMESTAMP WITH TIME ZONE, "completedAt" TIMESTAMP WITH TIME ZONE, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")); COMMENT ON COLUMN "tasks"."createdAt" IS '作成日時（UTC）'; COMMENT ON COLUMN "tasks"."updatedAt" IS '更新日時（UTC）'; COMMENT ON COLUMN "tasks"."userId" IS 'タスクの所有者ID'; COMMENT ON COLUMN "tasks"."title" IS 'タスクタイトル'; COMMENT ON COLUMN "tasks"."description" IS 'タスクの詳細説明'; COMMENT ON COLUMN "tasks"."status" IS 'タスクステータス（todo, in_progress, done, archived）'; COMMENT ON COLUMN "tasks"."priority" IS 'タスク優先度（low, medium, high, urgent）'; COMMENT ON COLUMN "tasks"."dueDate" IS 'タスクの期限日時（UTC）'; COMMENT ON COLUMN "tasks"."completedAt" IS 'タスク完了日時（UTC）'; COMMENT ON COLUMN "tasks"."position" IS '表示順序（小さい値ほど上位）'`);
        await queryRunner.query(`CREATE INDEX "ix_tasks_user_id" ON "tasks" ("userId") `);
        await queryRunner.query(`CREATE INDEX "ix_tasks_created_at" ON "tasks" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "ix_tasks_completed_at" ON "tasks" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "ix_tasks_position" ON "tasks" ("userId", "status", "position") `);
        await queryRunner.query(`CREATE INDEX "ix_tasks_user_due_date" ON "tasks" ("userId", "dueDate") `);
        await queryRunner.query(`CREATE INDEX "ix_tasks_user_priority" ON "tasks" ("userId", "priority") `);
        await queryRunner.query(`CREATE INDEX "ix_tasks_user_status" ON "tasks" ("userId", "status") `);
        await queryRunner.query(`CREATE TABLE "task_tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "taskId" uuid NOT NULL, "tagId" uuid NOT NULL, CONSTRAINT "uq_task_tags_task_tag" UNIQUE ("taskId", "tagId"), CONSTRAINT "PK_7b47a7628547c0976415988d3cb" PRIMARY KEY ("id")); COMMENT ON COLUMN "task_tags"."createdAt" IS '作成日時（UTC）'; COMMENT ON COLUMN "task_tags"."updatedAt" IS '更新日時（UTC）'; COMMENT ON COLUMN "task_tags"."taskId" IS '関連付けるタスクID'; COMMENT ON COLUMN "task_tags"."tagId" IS '関連付けるタグID'`);
        await queryRunner.query(`CREATE INDEX "ix_task_tags_task_tag" ON "task_tags" ("taskId", "tagId") `);
        await queryRunner.query(`CREATE INDEX "ix_task_tags_tag_id" ON "task_tags" ("tagId") `);
        await queryRunner.query(`CREATE INDEX "ix_task_tags_task_id" ON "task_tags" ("taskId") `);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "name" character varying(20) NOT NULL, "color" character varying(7) NOT NULL DEFAULT '#3B82F6', "description" character varying(200), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_tags_user_name" UNIQUE ("userId", "name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id")); COMMENT ON COLUMN "tags"."createdAt" IS '作成日時（UTC）'; COMMENT ON COLUMN "tags"."updatedAt" IS '更新日時（UTC）'; COMMENT ON COLUMN "tags"."userId" IS 'タグの所有者ID'; COMMENT ON COLUMN "tags"."name" IS 'タグ名'; COMMENT ON COLUMN "tags"."color" IS 'タグの表示色（16進数カラーコード）'; COMMENT ON COLUMN "tags"."description" IS 'タグの説明'; COMMENT ON COLUMN "tags"."isActive" IS 'アクティブフラグ（ソフトデリート用）'`);
        await queryRunner.query(`CREATE INDEX "ix_tags_user_id" ON "tags" ("userId") `);
        await queryRunner.query(`CREATE INDEX "ix_tags_active" ON "tags" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "ix_tags_user_active" ON "tags" ("userId", "isActive") `);
        await queryRunner.query(`CREATE INDEX "ix_tags_user_name" ON "tags" ("userId", "name") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "passwordHash" character varying(255) NOT NULL, "displayName" character varying(20) NOT NULL, "avatarUrl" character varying(500), "isActive" boolean NOT NULL DEFAULT true, "isVerified" boolean NOT NULL DEFAULT false, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "failedLoginAttempts" integer NOT NULL DEFAULT '0', "lockedUntil" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")); COMMENT ON COLUMN "users"."createdAt" IS '作成日時（UTC）'; COMMENT ON COLUMN "users"."updatedAt" IS '更新日時（UTC）'; COMMENT ON COLUMN "users"."email" IS 'メールアドレス（ログインID）'; COMMENT ON COLUMN "users"."passwordHash" IS 'Argon2ハッシュ化されたパスワード'; COMMENT ON COLUMN "users"."displayName" IS '表示名'; COMMENT ON COLUMN "users"."avatarUrl" IS 'アバター画像URL'; COMMENT ON COLUMN "users"."isActive" IS 'アカウント有効フラグ'; COMMENT ON COLUMN "users"."isVerified" IS 'メールアドレス認証済みフラグ'; COMMENT ON COLUMN "users"."lastLoginAt" IS '最終ログイン日時'; COMMENT ON COLUMN "users"."failedLoginAttempts" IS '連続ログイン失敗回数'; COMMENT ON COLUMN "users"."lockedUntil" IS 'アカウントロック解除日時'`);
        await queryRunner.query(`CREATE INDEX "ix_users_email" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "ix_users_last_login" ON "users" ("lastLoginAt") `);
        await queryRunner.query(`CREATE INDEX "ix_users_active_verified" ON "users" ("isActive", "isVerified") `);
        await queryRunner.query(`CREATE INDEX "ix_users_email_active" ON "users" ("email", "isActive") `);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_tags" ADD CONSTRAINT "FK_1470ad368e79cb5636163a4bf8d" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_tags" ADD CONSTRAINT "FK_ac1cfe87c11bc138ee8675cff3c" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_92e67dc508c705dd66c94615576" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_92e67dc508c705dd66c94615576"`);
        await queryRunner.query(`ALTER TABLE "task_tags" DROP CONSTRAINT "FK_ac1cfe87c11bc138ee8675cff3c"`);
        await queryRunner.query(`ALTER TABLE "task_tags" DROP CONSTRAINT "FK_1470ad368e79cb5636163a4bf8d"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`);
        await queryRunner.query(`DROP INDEX "public"."ix_users_email_active"`);
        await queryRunner.query(`DROP INDEX "public"."ix_users_active_verified"`);
        await queryRunner.query(`DROP INDEX "public"."ix_users_last_login"`);
        await queryRunner.query(`DROP INDEX "public"."ix_users_email"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tags_user_name"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tags_user_active"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tags_active"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tags_user_id"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP INDEX "public"."ix_task_tags_task_id"`);
        await queryRunner.query(`DROP INDEX "public"."ix_task_tags_tag_id"`);
        await queryRunner.query(`DROP INDEX "public"."ix_task_tags_task_tag"`);
        await queryRunner.query(`DROP TABLE "task_tags"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_user_status"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_user_priority"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_user_due_date"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_position"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_completed_at"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."ix_tasks_user_id"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
    }

}

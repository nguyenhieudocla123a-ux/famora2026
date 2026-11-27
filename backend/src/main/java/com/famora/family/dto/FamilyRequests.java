package com.famora.family.dto;

import com.famora.family.FamilyRole;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Request bodies of the family endpoints. */
public final class FamilyRequests {

    private FamilyRequests() {
    }

    public record CreateFamily(
            @NotBlank(message = "Nhập tên gia đình")
            @Size(max = 100, message = "Tên gia đình tối đa 100 ký tự")
            String name,
            @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
            String description,
            /** Defaults to true: everyone in the family may add events. */
            Boolean memberCanCreateEvents,
            @Size(max = 50, message = "Cách gọi tối đa 50 ký tự")
            String nickname) {
    }

    public record UpdateFamily(
            @NotBlank(message = "Nhập tên gia đình")
            @Size(max = 100, message = "Tên gia đình tối đa 100 ký tự")
            String name,
            @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
            String description,
            @NotNull(message = "Chọn thành viên có được tạo sự kiện không")
            Boolean memberCanCreateEvents) {
    }

    /** Only ADMIN or MEMBER can be given; OWNER moves through transfer-ownership. */
    public record ChangeRole(@NotNull(message = "Chọn vai trò") FamilyRole role) {
    }

    public record TransferOwnership(@NotNull(message = "Chọn người nhận quyền chủ nhà") Long memberId) {
    }

    public record CreateInvitation(
            FamilyRole role,
            @Min(value = 1, message = "Số lượt dùng từ 1 đến 50")
            @Max(value = 50, message = "Số lượt dùng từ 1 đến 50")
            Integer maxUses,
            @Min(value = 1, message = "Hạn dùng từ 1 đến 30 ngày")
            @Max(value = 30, message = "Hạn dùng từ 1 đến 30 ngày")
            Integer validDays) {
    }

    public record Join(
            @NotBlank(message = "Nhập mã mời")
            @Size(max = 20, message = "Mã mời không hợp lệ")
            String code,
            @Size(max = 50, message = "Cách gọi tối đa 50 ký tự")
            String nickname) {
    }
}

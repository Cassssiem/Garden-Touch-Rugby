using System.ComponentModel.DataAnnotations;

namespace RugbyManagementSystem.Domain.Entities;

public class AppDataDocument
{
    [Key]
    [MaxLength(100)]
    public string Key { get; set; } = string.Empty;

    public string Json { get; set; } = "{}";

    [Timestamp]
    public byte[]? RowVersion { get; set; }
}

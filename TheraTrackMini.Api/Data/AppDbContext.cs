using Microsoft.EntityFrameworkCore;
using TheraTrackMini.Api.Models;

namespace TheraTrackMini.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionEntry> SessionEntries => Set<SessionEntry>();
    public DbSet<SessionNote> SessionNotes => Set<SessionNote>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        modelBuilder.Entity<Session>()
            .HasOne(s => s.Note)
            .WithOne(n => n.Session)
            .HasForeignKey<SessionNote>(n => n.SessionId);

        modelBuilder.Entity<Client>()
            .HasMany(c => c.Goals)
            .WithOne(g => g.Client)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Session>()
            .HasMany(s => s.Entries)
            .WithOne(e => e.Session)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

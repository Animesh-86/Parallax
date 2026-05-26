import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class InspectDb {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:h2:file:./backend/backend/data/parallax;USER=sa;PASSWORD=";
        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT email, username, full_name FROM users");
            while (rs.next()) {
                System.out.println("Email: " + rs.getString("email"));
                System.out.println("Username: " + rs.getString("username"));
                System.out.println("Full Name: " + rs.getString("full_name"));
                System.out.println("---");
            }
        }
    }
}

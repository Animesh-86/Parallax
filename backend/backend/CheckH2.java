import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckH2 {
    public static void main(String[] args) throws Exception {
        Class.forName("org.h2.Driver");
        Connection conn = DriverManager.getConnection("jdbc:h2:file:./data/parallax;MODE=PostgreSQL", "sa", "");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT path, content FROM project_file WHERE path = 'test.py'");
        while(rs.next()) {
            System.out.println("PATH: " + rs.getString("path"));
            String content = rs.getString("content");
            System.out.println("CONTENT_LENGTH: " + (content == null ? "null" : content.length()));
            System.out.println("CONTENT: [" + content + "]");
        }
        rs.close();
        stmt.close();
        conn.close();
    }
}

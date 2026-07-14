import requests
import uuid

base_url = "http://localhost:8080/api/v1"
session = requests.Session()

# 1. Sign up
signup_data = {
    "username": "testuser" + str(uuid.uuid4())[:8],
    "email": "testuser" + str(uuid.uuid4())[:8] + "@example.com",
    "password": "password123",
    "fullName": "Test User"
}
r_signup = session.post(f"{base_url}/auth/signup", json=signup_data)
print("Signup:", r_signup.status_code, r_signup.text)

# 2. Login
token = r_signup.json().get("accessToken")
session.headers.update({"Authorization": f"Bearer {token}"})

# 3. Create Project
project_data = {
    "name": "Test Project " + str(uuid.uuid4())[:8],
    "language": "python",
    "githubRepoUrl": ""
}
r_proj = session.post(f"{base_url}/projects", json=project_data)
print("Create Project:", r_proj.status_code, r_proj.text)
project_id = r_proj.json().get("id")

# 4. Bootstrap Workspace
r_boot = session.get(f"{base_url}/api/v1/projects/{project_id}/bootstrap")
print("Bootstrap:", r_boot.status_code, r_boot.text)

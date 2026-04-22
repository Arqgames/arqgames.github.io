with open('index.html', 'r') as f:
    lines = f.readlines()

# Find after sortEventsChrono
for i, line in enumerate(lines):
    if 'function sortEventsChrono(a, b) {' in line:
        # Insert after the function
        insert_pos = i + 3  # after the closing }
        lines.insert(insert_pos, '\n')
        lines.insert(insert_pos + 1, '        // ✅ 共通：currentTask から正解ID配列を作る\n')
        lines.insert(insert_pos + 2, '        function getCorrectIds() {\n')
        lines.insert(insert_pos + 3, '            if (!Array.isArray(currentTask) || currentTask.length === 0) return [];\n')
        lines.insert(insert_pos + 4, '            return [...currentTask].sort(sortEventsChrono).map(e => String(e.id));\n')
        lines.insert(insert_pos + 5, '        }\n')
        lines.insert(insert_pos + 6, '\n')
        break

with open('index.html', 'w') as f:
    f.writelines(lines)

import re

# Read the file
with open('renderer/core/configGenerator.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix indentation for all method bodies
# Pattern: method declaration followed by body with wrong indentation
lines = content.split('\n')
fixed_lines = []
in_method = False
method_indent_level = 0

for i, line in enumerate(lines):
    # Check if this is a method declaration (has function name followed by parentheses)
    if re.match(r'^    \w+\([^)]*\)\s*\{', line):
        # This is a method declaration at class level
        in_method = True
        method_indent_level = 4  # Class methods should have 4 spaces
        fixed_lines.append(line)
    elif in_method and line.strip() and not line.startswith('      '):
        # This line is inside a method but doesn't have correct indentation
        # It should have at least 6 spaces (4 for method + 2 for body)
        if line.startswith('    ') and not line.startswith('      '):
            # Add 2 more spaces
            fixed_lines.append('  ' + line)
        else:
            fixed_lines.append(line)
    else:
        fixed_lines.append(line)
    
    # Check if method ends
    if in_method and line.strip() == '}' and line.startswith('  }'):
        in_method = False

# Write back
with open('renderer/core/configGenerator.js', 'w', encoding='utf-8') as f:
    f.write('\n'.join(fixed_lines))

print("Fixed indentation in configGenerator.js")

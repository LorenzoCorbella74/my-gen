Test @if command with new features
Starting @if test

Set up test variables
`@set name "John"`
`@set age "25"`
`@set status "active"`

Test variable comparison with @if ... is
Testing variable comparison - name is John
**If condition:** `name is "John"`

✅ Name is correctly John
**End condition**


Test variable comparison with interpolation
`@set expected_name "John"`
Testing variable comparison with interpolation
**If condition:** `name is "{expected_name}"`

✅ Name matches expected value with interpolation
**End condition**


Test @if ... isnot
Testing variable comparison - status is not inactive
**If condition:** `status isnot "inactive"`

✅ Status is not inactive
**End condition**


Test @elseif
Testing @elseif functionality
**If condition:** `age is "30"`

❌ This should not execute - age is not 30
**Else if condition:** `age is "25"`

✅ Correct! Age is 25 (elseif worked)
**Else if condition:** `age is "20"`

❌ This should not execute - age is not 20
**End condition**


Test file existence
Testing file existence
**If condition:** `exists "test/test_if.gen"`

✅ Test file exists
**Else if condition:** `exists "nonexistent.txt"`

❌ This should not execute
**End condition**


Test multiple conditions with different types
Testing complex conditions
`@set file_status "missing"`
**If condition:** `file_status is "present"`

❌ File should not be present
**Else if condition:** `file_status is "missing"`

✅ File status is correctly missing
**If condition:** `name isnot "Jane"`

✅ Nested condition: name is not Jane
**End condition**

**End condition**


Test with non-existing variable (should be handled gracefully)
Testing with undefined variable
**If condition:** `undefined_var is "test"`

❌ This should not execute - undefined_var doesn't exist
**Else if condition:** `undefined_var isnot "test"`

✅ Correctly handled undefined variable
**End condition**


@if test completed successfully!
Feature: Addition
  Scenario: 1 + 0
    Given I start with 1
    When I add 0
    Then I end up with 1
  
  Scenario: 1 + 1
    Given I start with 1
    When I add 1
    Then I end up with 2
  
  Scenario Outline: Lots of additions
    Given I start with <left>
    When I add <right>
    Then I end up with <result>

    Examples:
      | left | right | result |
      |  100 |     5 |    105 |
      |   99 |  1234 |   1333 |
      |   12 |     5 |     17 |